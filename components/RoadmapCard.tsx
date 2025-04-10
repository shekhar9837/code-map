import React from 'react'
import { Card } from './ui/card'
import { Tabs, TabsContent, TabsList } from './ui/tabs'
import { StepCard } from './ui/step-card'
import { Step } from '@/lib/types'

const RoadmapCard = ({topic, youtubeLinks, githubLinks, resources}) => {
    return (
        <Card className="overflow-hidden bg-background ">
            <Tabs defaultValue="formatted" className="w-full bg-roadmap-mesh">
                <TabsList className="grid w-full grid-cols-1">
                    {/* <TabsTrigger value="formatted">Formatted</TabsTrigger> */}
                    {/* <TabsTrigger value="roadmap">Roadmap</TabsTrigger> */}
                </TabsList>
                <TabsContent value="formatted" className="m-0">
                    <div className="p-6">
                        <h1 className="text-3xl font-bold mb-6">
                            ✨ Learning Path for {topic}
                        </h1>
                        <p className="text-slate-100 mb-6">
                            🎯 Resource Summary: {youtubeLinks.length} Videos ·{" "}
                            {githubLinks.length} Repositories
                        </p>
                        {/* {typeof resources === 'object' && 'steps' in resources ? ( */}
                        {resources &&
                            typeof resources === "object" &&
                            "steps" in resources &&
                            resources.steps.map((step: Step) => (
                                <StepCard
                                    key={step.id}
                                    id={step.id}
                                    title={step.title}
                                    duration={step.duration}
                                    description={step.description}
                                    resources={step.resources}
                                    practice={step.practice}
                                    validatedResources={step.validatedResources}
                                />
                            ))}

                    </div>
                </TabsContent>


            </Tabs>
        </Card>)
}

export default RoadmapCard