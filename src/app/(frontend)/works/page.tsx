import Navigation from "@/components/molecules/navigation";
import Title from "@/components/molecules/title";

export default function WorksPage() {
    return (
        <div className="sheet">
            <Navigation title="~/works" actions={
                [
                    {
                        icon: "LayoutGrid",
                        label: "Show grid",
                        href: "?grid=true",
                        variant: "fill"
                    },
                    {
                        icon: "TableView",
                        label: "Show list",
                        href: "?grid=false",
                        variant: "none"
                    }
                ]
            } />
            <Title title="Recent work" description="Recent projects that I've been working on that include user-centricity, and lean approach." />
        </div>
    )
}